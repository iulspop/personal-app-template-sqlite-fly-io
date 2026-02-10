import { autoRoutes } from "react-router-auto-routes";

export default autoRoutes({
  ignoredRouteFiles: ["*.test.ts", "*.test.tsx", "*.spec.ts"],
});
