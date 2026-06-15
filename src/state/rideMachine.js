export const S = {
  IDLE: "IDLE",
  REQUESTING: "REQUESTING",
  ACCEPTED: "ACCEPTED",
  EN_ROUTE: "EN_ROUTE",
  ARRIVED: "ARRIVED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
};

export const TERMINAL = new Set([S.COMPLETED, S.CANCELLED, S.REJECTED]);


const ALLOWED = {
  [S.IDLE]: [S.REQUESTING],
  [S.REQUESTING]: [S.ACCEPTED, S.REJECTED, S.CANCELLED],
  [S.ACCEPTED]: [S.EN_ROUTE, S.CANCELLED],
  [S.EN_ROUTE]: [S.ARRIVED, S.CANCELLED],
  [S.ARRIVED]: [S.IN_PROGRESS, S.CANCELLED],
  [S.IN_PROGRESS]: [S.COMPLETED, S.CANCELLED],
  [S.COMPLETED]: [],
  [S.CANCELLED]: [],
  [S.REJECTED]: [],
};

export function canTransition(from, to) {
  return (ALLOWED[from] || []).includes(to);
}

export function rideReducer(state, action) {
  switch (action.type) {
    case "SET_STATUS": {
      const next = action.status;
      if (!canTransition(state.status, next)) {
        console.warn(`Blocked illegal transition: ${state.status} → ${next}`);
        return state; 
      }
      return { ...state, status: next, ...action.patch };
    }
    case "SYNC": 
      return { ...state, ...action.trip };
    case "RESET":
      return { ...action.initial };
    default:
      return state;
  }
}