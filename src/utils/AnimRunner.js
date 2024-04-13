import { groupBy, mapValues, mergeWith, sortBy } from 'lodash-es';
import FormulaParser from 'fparser';

const ST_INITIAL = 0;
const ST_RUNNING = 1;
const ST_STOPPED = 2;

const sleep = time => new Promise(
  resolve => setTimeout(resolve, time)
);

const nextTick = fn => setTimeout(fn, 0);

/**
 * Parses and evaluates the provided expression, returns the final result.
 * Throws when parsing error.
 * @param {string} expression Expression to be evaluated.
 * @param {*} definitions Predefined variables and functions.
 */
function parseFormula(expression, definitions = {}) {
  const parser = new FormulaParser(expression);
  const result = parser.evaluate(definitions);
  return result;
}

/**
 * Merge a group of keyframes.
 * @param {Array} keyframes Array of keyframes to be merged.
 */
function mergeKeyframes(keyframes) {
  const offsetKfsGrp = groupBy(keyframes, 'offset');
  const mergedKfsGrp = mapValues(offsetKfsGrp, offsetKfs =>
    offsetKfs.reduce((merged, keyframe) =>
      mergeWith(merged, keyframe, (value, srcValue, key) => {
        if (value === undefined) return srcValue;
        switch (key) {
          case 'transform': return `${value} ${srcValue}`;
          default: return srcValue;
        }
      }
    ), {})
  );
  return sortBy(Object.values(mergedKfsGrp), 'offset');
}

export default class AnimRunner {
  /** current running status */
  status = ST_INITIAL
  /** animation targets container */
  $container = null
  /** timeline nodes */
  timeline = {}
  /** repeated nodes' repeat counts */
  repeatCounts = {}
  /** onBegin actions */
  beginQueue = []
  /** onClick actions */
  clickQueue = []
  /** animation queued for batch excution */
  animQueue = []
  /** timeout for batch animation */
  animQueueTimer = 0

  constructor($container, timeline) {
    if (!$container || !timeline) {
      throw new Error('Construct: a valid container dom and timeline object must be supplied.');
    }
    this.$container = $container;
    this.timeline = timeline;
  }

  async start() {
    if (!this.timeline || !this.timeline.par) return;
    this.status = ST_RUNNING;
    // do startup
    this.placeNodes(this.timeline);
    // run nodes
    nextTick(() => this.runNodes(this.timeline));
    // Trigger onBegin condition in task
    nextTick(() => {
      while (this.beginQueue.length > 0) {
        const actionFn = this.beginQueue.shift();
        actionFn();
      }
    });
  }

  next() {
    if (!this.clickQueue.length) return false;
    const nextAction = this.clickQueue.shift();
    nextAction();
    return true;
  }

  destroy() {
    clearTimeout(this.animQueueTimer);
    this.status = ST_STOPPED;
  }

  placeNodes(nodesObj) {
    const keyframesObj = {};
    const seenShapes = {};
    const traverseNodes = nodesObj => {
      let seenShapeID;
      Object.keys(nodesObj).forEach((type) => {
        const nodes = nodesObj[type];

        if (!['anim', 'animEffect', 'animRot', 'animScale'].includes(type)) {
          nodes.forEach(({ children }) => children && traverseNodes(children));
          return;
        }
        // skip seen shape
        seenShapeID = nodes[0].shapeID;
        if (seenShapes[seenShapeID]) return;

        nodes.forEach((node) => {
          const { shapeID, keyframes } = node;
          keyframesObj[shapeID] = keyframesObj[shapeID] || [];
          keyframesObj[shapeID].push(
            this.parseKeyframe(keyframes[0], node)
          );
        });
      });
      seenShapes[seenShapeID] = true;
    };
    traverseNodes(nodesObj);
    // Place node by its first keyframe
    for (let shapeID in keyframesObj) {
      const $shape = this.getTargetByID(shapeID);
      const keyframes = keyframesObj[shapeID];
      const [firstKeyframe] = mergeKeyframes(keyframes);
      const { offset: ignored, ...styles } = firstKeyframe;
      Object.assign($shape.style, styles);
    }
  }

  async runNodes(nodesObj) {
    if (!nodesObj) return;
    const prs = Object.keys(nodesObj).map(type => Promise.all(
      nodesObj[type].map(node => this.runNode(type, node))
    ));
    return Promise.all(prs);
  }

  async runNode(type, node) {
    const { id, startConditions, restart, repeatCount } = node;
    await this.checkCondition(startConditions, node);
    // Stop in case the runner is destroyed when running a repeatable node
    if (this.status === ST_STOPPED) return;
    switch (type) {
      case 'seq':
      case 'par':
        await this.runNodes(node.children);
        break;
      case 'set':
        await this.runSet(node);
        break;
      case 'animRot':
      case 'animScale':
      case 'animEffect':
      case 'anim':
        await this.runAnim(node);
        break;
      default:
        // console.warn('unsupported anim type:', type, node);
    }
    if (repeatCount || (restart && restart !== 'never')) {
      const limit = restart || repeatCount === 'indefinite'
        ? Number.POSITIVE_INFINITY : parseInt(`0${repeatCount}`);
      this.repeatCounts[id] = (this.repeatCounts[id] || 0) + 1;
      // TODO: run repeatable node by recursion may cause memory leak
      if (this.repeatCounts[id] < limit) this.runNode(type, node);
    }
  }

  async checkCondition(condList = [], context = {}) {
    if (!condList || !condList.length) return;
    return Promise.race(condList.map((cond) => {
      const { evt, delay, shapeID } = cond;
      const delayTime = parseInt(`0${delay}`);
      // Indefinite delay time, call next to continue running
      if (delay === 'indefinite') {
        const hasEvt = condList.find(c => c.evt);
        // Return a pending promise if there is an event condition
        if (hasEvt) return new Promise(() => {});
        // Default action: add this condition to clickQueue
        return new Promise(resolve => this.clickQueue.push(resolve));
      }
      if (evt === 'onBegin') {
        return new Promise(resolve => this.beginQueue.push(async () => {
          if (delayTime) await sleep(delayTime);
          resolve();
        }));
      }
      if (evt === 'onClick') {
        const $target = this.getTargetByID(shapeID);
        $target.style.setProperty('cursor', 'pointer');
        $target.style.setProperty('z-index', 99);
        return new Promise(resolve => $target.addEventListener('click',
          async function listener(event) {
            const { evtFilter } = context;
            $target.removeEventListener('click', listener);
            if (evtFilter === 'cancelBubble') {
              event.preventDefault();
              event.stopPropagation();
            }
            if (delayTime) await sleep(delayTime);
            resolve();
          }
        ));
      }
      if (delayTime) return sleep(delayTime);
      return Promise.resolve();
    }));
  }

  async runSet(node) {
    // debug('run set', node.id, node);
    const { shapeID, attrName, toValue, dur } = node;

    await sleep(parseInt(`0${dur}`));

    const $shape = this.getTargetByID(shapeID);
    const style = this.parseAttribute($shape, attrName, toValue);
    const [[styleName, styleValue]] = Object.entries(style);
    $shape.style.setProperty(styleName, styleValue);
  }

  async runAnim(node) {
    // debug('run anim', node.id, node);
    const { shapeID, dur, keyframes, fill } = node;
    const kfs = keyframes.map(keyframe => this.parseKeyframe(keyframe, node));
    const options = {
      duration: parseInt(dur),
      fill: ({ 'hold': 'forwards' })[fill || 'hold'],
    };

    return new Promise(resolve => this.queueAnimation({
      target: shapeID,
      keyframes: kfs,
      options,
      callback: resolve,
    }));
  }

  parseKeyframe(keyframe, { shapeID, attrName, formula }) {
    const { offset, value } = keyframe;
    const $shape = this.getTargetByID(shapeID);
    if (attrName === undefined || value === undefined) return keyframe;
    let v;
    if (formula) {
      v = this.parseFormula(formula, { target: $shape, attrName, input: +value });
    } else {
      v = this.parseFormula(value, { target: $shape, attrName });
    }
    return {
      offset,
      ...this.parseAttribute($shape, attrName, v),
    };
  }

  /**
   * Parse the attribute value of an element to css styles.
   * @param {HTMLElement} target target dom element
   * @param {string} attrName attribute name
   * @param {string | number} value attribute value
   */
  parseAttribute(target, attrName, value) {
    const { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h } = target;
    switch (attrName) {
      case 'ppt_x':
        return { transform: `translateX(${value - x}px)` };
      case 'ppt_y':
        return { transform: `translateY(${value - y}px)` };
      case 'ppt_w':
        return { transform: `scaleX(${value / w})` };
      case 'ppt_h':
        return { transform: `scaleY(${value / h})` };
      case 'style.visibility':
        return { visibility: value };
    }
    return {};
  }

  parseFormula(formula, { target, attrName, input }) {
    const $ctn = target.closest('section');
    const { offsetWidth: ctnW, offsetHeight: ctnH } = $ctn;
    const { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h } = target;
    const baseMap = {
      ppt_x: ctnW, ppt_y: ctnH, ppt_w: w, ppt_h: h,
    };
    const expression = formula
      .replace(/\$/gi, '[input]') // convert '$' to '[input]'
      .replace(/(pi|e)/gi, match => match.toUpperCase())
      .replace(/#([a-zA-Z_]+)/gi, '[$1]') // convert '#variable' to '[variable]'
      .replace(/(?=[^\d])(\.\d+)/gi, '0$1'); // convert '.123' to '0.123'

    return parseFormula(`${baseMap[attrName]}*(${expression})`, {
      'input': input,
      'ppt_x': x / baseMap.ppt_x,
      'ppt_y': y / baseMap.ppt_y,
      'ppt_w': w / baseMap.ppt_w,
      'ppt_h': h / baseMap.ppt_h,
    });
  }

  getTargetByID(shapeID) {
    return this.$container.querySelector(`[_id="${shapeID}"]`);
  }

  /**
   * Queue animation for a batch run.
   * When applying different animations on one target, only the last one take effect.
   * While the `composite: 'add'` option is currently not supported in the WebAnimation API,
   * we must do batch run for animations.
   * @param {object} animation The animation configs
   */
  queueAnimation({ target, keyframes, options, callback }) {
    this.animQueue.push({ target, keyframes, options, callback });
    clearTimeout(this.animQueueTimer);
    this.animQueueTimer = setTimeout(() => {
      this.flushAnimQueue();
    }, 10);
  }

  /**
   * Perform animations in the current animation queue.
   */
  flushAnimQueue() {
    const animQueue = this.animQueue;
    const targetGroup = groupBy(animQueue, 'target');
    for (const target in targetGroup) {
      const $target = this.getTargetByID(target);
      const anims = targetGroup[target];
      const keyframes = mergeKeyframes(
        anims.reduce((ret, a) => ret.concat(a.keyframes), [])
      );
      const options = Object.assign.apply({}, anims.map(a => a.options));
      const callbacks = anims.map(a => a.callback).filter(cb => cb);
      // debug('flush anim', target, keyframes, options);
      $target.animate(keyframes, options)
        .addEventListener('finish', () => callbacks.forEach(cb => cb()));
    }
    this.animQueue = [];
  }
}
