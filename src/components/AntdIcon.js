import * as React from 'react';
import classNames from 'classnames';
import ReactIcon from './IconBase';
import { getTwoToneColor, setTwoToneColor } from './twoTonePrimaryColor';
import { normalizeTwoToneColors } from '../utils';
// Initial setting
// should move it to antd main repo?
setTwoToneColor('#1890ff');
const Icon = React.forwardRef((props, ref) => {
    const { 
    // affect outter <i>...</i>
    className, 
    // affect inner <svg>...</svg>
    icon, spin, rotate, tabIndex, onClick, 
    // other
    twoToneColor, ...restProps } = props;
    const classString = classNames('anticon', { [`anticon-${icon.name}`]: Boolean(icon.name) }, className);
    const svgClassString = classNames({
        'anticon-spin': !!spin || icon.name === 'loading',
    });
    let iconTabIndex = tabIndex;
    if (iconTabIndex === undefined && onClick) {
        iconTabIndex = -1;
    }
    const svgStyle = rotate
        ? {
            msTransform: `rotate(${rotate}deg)`,
            transform: `rotate(${rotate}deg)`,
        }
        : undefined;
    const [primaryColor, secondaryColor] = normalizeTwoToneColors(twoToneColor);
    return (React.createElement("span", Object.assign({ role: "img", "aria-label": icon.name }, restProps, { ref: ref, tabIndex: iconTabIndex, onClick: onClick, className: classString }),
        React.createElement(ReactIcon, { className: svgClassString, icon: icon, primaryColor: primaryColor, secondaryColor: secondaryColor, style: svgStyle })));
});
Icon.displayName = 'AntdIcon';
Icon.getTwoToneColor = getTwoToneColor;
Icon.setTwoToneColor = setTwoToneColor;
export default Icon;
