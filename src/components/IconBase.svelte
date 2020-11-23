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
  export let primaryColor = "";
  export let secondaryColor = "";
  export let className = "";
  export let restProps = {};

  useInsertStyles();
  warning(
    isIconDefinition(icon),
    `icon should be icon definiton, but got ${icon}`
  );
  let colors = twoToneColorPalette;
  $: if (primaryColor) {
    colors = {
      primaryColor,
      secondaryColor: secondaryColor || getSecondaryColor(primaryColor)
    };
  }
  $: svgHtml = renderIconDefinitionToSVGElement(icon, {
    placeholders: {
      primaryColor: colors.primaryColor,
      secondaryColor: colors.secondaryColor
    },
    extraSVGAttrs: {
      style,
      ...restProps,
      class: className,
      "data-icon": icon.name,
      width: "1em",
      height: "1em",
      fill: "currentColor",
      "aria-hidden": "true"
    }
  });
</script>

{#if icon}
  {@html svgHtml}
{/if}
