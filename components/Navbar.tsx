// The previous desktop navbar has been retired. This file now forwards the
// shared `Navbar` import (used across ~all pages) to the new floating
// glass navbar (NavbarNeo). Pages that render <Navbar /> get the in-flow
// spacer automatically so their content clears the fixed bar; the homepage
// renders <NavbarNeo overlay /> directly for the hero overlay.
export { default } from "@/components/home/NavbarNeo";
