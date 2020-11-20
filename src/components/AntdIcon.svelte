<script>
  import AccountBookTwoToneSvg from "@ant-design/icons-svg/lib/asn/AccountBookTwoTone";

  //   <UpCircleTwoTone />
  import { setTwoToneColor } from "./twoTonePrimaryColor";
  import { normalizeTwoToneColors } from "../utils";
  import classNames from "classnames";
  import IconBase from "./IconBase.svelte";

  setTwoToneColor("#1890ff");

  export let className = undefined;
  export let icon = AccountBookTwoToneSvg;
  export let spin = false;
  export let rotate = 0;
  //   export let tabIndex = undefined;
  export let twoToneColor = undefined;

  const classString = classNames(
    "anticon",
    { [`anticon-${icon.name}`]: Boolean(icon.name) },
    className
  );
  const svgClassString = classNames({
    "anticon-spin": !!spin || icon.name === "loading"
  });
  // TODO: tabindex
  //   let iconTabIndex = tabIndex;
  //   if (iconTabIndex === undefined && onClick) {
  //     iconTabIndex = -1;
  //   }
  const svgStyle = rotate
    ? `msTransform: rotate(${rotate}deg);transform: rotate(${rotate}deg);`
    : undefined;

  const [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
  //   console.log("p1: ", primaryColor);
  //   console.log("p2: ", secondaryColor);
</script>

<span role="img" aria-label={icon.name} className={classString}>
  <IconBase
    {icon}
    className={svgClassString}
    primaryColor="blue"
    {secondaryColor}
    style={svgStyle} />
</span>
