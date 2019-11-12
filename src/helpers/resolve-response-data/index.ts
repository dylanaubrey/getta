import { ResponseDataWithErrors } from "../../types";

export default function resolveResponseData({ data, errors }: ResponseDataWithErrors) {
  const responseData: ResponseDataWithErrors = {};
  if (data) responseData.data = data;
  if (errors && errors.length) responseData.errors = errors;
  return responseData;
}
