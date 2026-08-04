import type { ConfigPlugin } from "@expo/config-plugins";

export interface PostbackExpoPluginProps {
  advertisingAttributionEndpoint?: string;
}

declare const withPostback: ConfigPlugin<PostbackExpoPluginProps | void>;

export default withPostback;
