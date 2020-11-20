import { normalizeTwoToneColors, getSecondaryColor } from "../utils";

export const twoToneColorPalette = {
  primaryColor: "#333",
  secondaryColor: "#E6E6E6",
  calculated: false
};
export function setTwoToneColors({ primaryColor, secondaryColor }) {
  twoToneColorPalette.primaryColor = primaryColor;
  twoToneColorPalette.secondaryColor =
    secondaryColor || getSecondaryColor(primaryColor);
  twoToneColorPalette.calculated = !!secondaryColor;
}
export function getTwoToneColors() {
  return {
    ...twoToneColorPalette
  };
}
export function setTwoToneColor(twoToneColor) {
  const [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
  return setTwoToneColors({
    primaryColor,
    secondaryColor
  });
}
export function getTwoToneColor() {
  const colors = getTwoToneColors();
  if (!colors.calculated) {
    return colors.primaryColor;
  }
  return [colors.primaryColor, colors.secondaryColor];
}
