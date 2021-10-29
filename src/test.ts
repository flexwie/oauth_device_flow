import { DeviceFlowClient } from "index";

const app = new DeviceFlowClient({
  audience: "https://lnk.wie.gg",
  client_id: "Cq4ugV3lY0JczABgY4th64XvPQRInsJ0",
  scopes: ["openid", "offline_access"],
  code_url: "https://wiegg.eu.auth0.com/oauth/device/code",
  token_url: "https://wiegg.eu.auth0.com/oauth/token",
});

app
  .acquireToken()
  .then(() => {
    console.log(app.cache);
    app.acquireTokenSilently().then(() => console.log("slient"));
  })
  .catch(() => {
    return;
  });
