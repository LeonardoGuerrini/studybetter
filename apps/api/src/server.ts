import { makeApp } from "./app";
import { env } from "./infrastructure/config/env";

const app = makeApp();

app.listen(env.PORT, () => {
  console.log(`[api] Study Better API rodando em http://localhost:${env.PORT}`);
});
