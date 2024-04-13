export const CTRL_FIRST = 0;
export const CTRL_PREV = 1;
export const CTRL_NEXT = 2;
export const CTRL_LAST = 3;
export const CTRL_OVERVIEW = 4;
export const CTRL_NOTES = 5;
export const CTRL_OPEN = 6;
export const CTRL_FULLSCREEN = 7;
export const CTRL_PAGER = 8;

export const CONTROL_BUTTONS = [
  [{
    key: CTRL_FIRST,
    title: '首页',
    icon: 'db-arrow-left',
  }, {
    key: CTRL_PREV,
    title: '上一页',
    icon: 'arrow-left',
  }, {
    key: CTRL_PAGER,
    title: '页码',
    label: ({ slideNo, slidesCount }) => `${slidesCount && slideNo + 1} / ${slidesCount}`,
  }, {
    key: CTRL_NEXT,
    title: '下一页',
    icon: 'arrow-right',
  }, {
    key: CTRL_LAST,
    title: '尾页',
    icon: 'db-arrow-right',
  }],
  [{
    key: CTRL_OVERVIEW,
    title: '目录',
    icon: 'overview',
  }, {
    key: CTRL_NOTES,
    title: '备注',
    icon: 'text',
  }, {
    key: CTRL_OPEN,
    title: '打开',
    icon: 'share',
  }, {
    key: CTRL_FULLSCREEN,
    title: '全屏',
    icon: 'enter-fullscreen',
  }]
];
