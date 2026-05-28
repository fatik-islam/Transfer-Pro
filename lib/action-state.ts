export interface ActionState {
  ok: boolean;
  message: string;
  reference?: string;
  checkoutUrl?: string;
}

export const initialActionState: ActionState = {
  ok: false,
  message: ""
};
