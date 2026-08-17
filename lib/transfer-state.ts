export type TransferActionState = {
  ok: boolean;
  message: string;
};

export const INITIAL_STATE: TransferActionState = {
  ok: false,
  message: "",
};

export const INITIAL_TRANSFER_STATE = INITIAL_STATE;