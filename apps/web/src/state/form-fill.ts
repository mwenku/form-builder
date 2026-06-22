import { atomFamily } from "recoil";
import type { UserErrorCode } from "@/lib/user-messages";

export type FormFillUiState = {
  values: Record<string, unknown>;
  fieldErrors: Record<string, string>;
  submitted: boolean;
  submitErrorCode: UserErrorCode | null;
};

const defaultFormFillUiState: FormFillUiState = {
  values: {},
  fieldErrors: {},
  submitted: false,
  submitErrorCode: null,
};

export const formFillUiState = atomFamily<FormFillUiState, string>({
  key: "formFillUiState",
  default: defaultFormFillUiState,
});
