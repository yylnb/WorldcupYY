export const INITIAL_BALANCE = 1_000_000n;
export const SESSION_COOKIE = "worldcupyy_session";
export const SESSION_DAYS = 14;

export const PICK_LABELS = {
  HOME: "主胜",
  DRAW: "平局",
  AWAY: "客胜"
} as const;

export const STATUS_LABELS = {
  SCHEDULED: "未开始",
  LIVE: "进行中",
  FINISHED: "已结束",
  VOID: "作废"
} as const;

export const BET_STATUS_LABELS = {
  PENDING: "待结算",
  WON: "已中奖",
  LOST: "未中奖",
  REFUNDED: "已退款"
} as const;
