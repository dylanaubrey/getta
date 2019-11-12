import {
  CLIENT_ERROR_REPSONSE,
  INFORMATION_REPSONSE,
  REDIRECTION_REPSONSE,
  SERVER_ERROR_REPSONSE,
  SUCCESSFUL_REPSONSE,
} from "../../constants";

export default function getResponseGroup(status: number) {
  switch (true) {
    case status < 200:
      return INFORMATION_REPSONSE;
    case status < 300:
      return SUCCESSFUL_REPSONSE;
    case status < 400:
      return REDIRECTION_REPSONSE;
    case status < 500:
      return CLIENT_ERROR_REPSONSE;
    default:
      return SERVER_ERROR_REPSONSE;
  }
}
