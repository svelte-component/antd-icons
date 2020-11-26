<script>
  import { setTwoToneColor } from "./twoTonePrimaryColor";
  import { normalizeTwoToneColors } from "../utils";
  import classNames from "classnames";
  import IconBase from "./IconBase.svelte";

  setTwoToneColor("#1890ff");

  export let className = undefined;
  export let icon = undefined;
  export let spin = false;
  export let rotate = 0;
  export let tabIndex = undefined;
  export let twoToneColor = undefined;
  export let restProps = {};
  export let restSvgProps = {};
  export let style = undefined;

  $: classString = classNames(
    "anticon",
    { [`anticon-${icon.name}`]: Boolean(icon.name) },
    className
  );

  $: svgClassString = classNames({
    "anticon-spin": !!spin || icon.name === "loading"
  });

  $: svgStyle = rotate
    ? `msTransform: rotate(${rotate}deg);transform: rotate(${rotate}deg);`
    : undefined;

  $: [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
</script>

<span
  on:click
  role="img"
  {tabIndex}
  aria-label={icon.name}
  class={classString}
  {style}
  {...restProps}>
  <IconBase
    {icon}
    {primaryColor}
    {secondaryColor}
    className={svgClassString}
    restProps={restSvgProps}
    style={svgStyle} />
</span>
