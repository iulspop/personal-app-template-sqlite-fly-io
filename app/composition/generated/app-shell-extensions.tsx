import { NavLink } from "react-router"

import type { AppShellExtensionContext } from "../composition-types"

export const renderAppShellFeatureExtension = ({
  canClaimOwner,
}: AppShellExtensionContext) =>
  canClaimOwner ? (
    <>
      <span>Your account can claim the owner chat seat.</span>
      <NavLink to="/owner/claim">Set up owner access</NavLink>
    </>
  ) : null
