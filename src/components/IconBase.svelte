<script>
  import { renderIconDefinitionToSVGElement } from "@ant-design/icons-svg/lib/helpers";
  import {
    getSecondaryColor,
    isIconDefinition,
    warning,
    useInsertStyles
  } from "../utils";

  import { twoToneColorPalette } from "./twoTonePrimaryColor";

  export let icon = undefined;
  export let style = "";
  export let primaryColor = undefined;
  export let secondaryColor = undefined;
  let colors = twoToneColorPalette;
  if (primaryColor) {
    colors = {
      primaryColor,
      secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
    };
  }

  let target = icon;
  console.log(icon);
  if (target && typeof target.icon === "function") {
    target = {
      ...target,
      icon: target.icon(colors.primaryColor, colors.secondaryColor)
    };
  }

  useInsertStyles();
  warning(
    isIconDefinition(icon),
    `icon should be icon definiton, but got ${icon}`
  );

  const svg = renderIconDefinitionToSVGElement(target, {
    placeholders: {
      primaryColor,
      secondaryColor
    },
    extraSVGAttrs: {
      style,
      "data-icon": target.name,
      width: "1em",
      height: "1em",
      fill: "currentColor",
      "aria-hidden": "true"
    }
  });

  console.log("svg: ", svg);
</script>

{#if icon}
  {@html svg}
{/if}
