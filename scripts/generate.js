// import * as allIconDefs from "@ant-design/icons-svg";
const allIconDefs = require("@ant-design/icons-svg");
const path = require("path");
const fs = require("fs");
const util = require("util");
const { promisify } = util;
const { template } = require("lodash");

const writeFile = promisify(fs.writeFile);

function walk(fn) {
  return Promise.all(
    Object.keys(allIconDefs).map((svgIdentifier) => {
      const iconDef = allIconDefs;

      return fn({ svgIdentifier, ...iconDef });
    })
  );
}

async function generateIcons() {
  const iconsDir = path.join(__dirname, "../src/icons");
  try {
    await promisify(fs.access)(iconsDir);
  } catch (err) {
    await promisify(fs.mkdir)(iconsDir);
  }

  const render = template(
    `
<script>
// GENERATE BY ./scripts/generate.js
// DON NOT EDIT IT MANUALLY

  import <%= svgIdentifier %>Svg from '@ant-design/icons-svg/es/asn/<%= svgIdentifier %>';
  import AntdIcon from "../components/AntdIcon.svelte";
  export let className = undefined;
  export let spin = undefined;
  export let rotate = undefined;
  export let twoToneColor = undefined;
  export let style = undefined;
  export let restProps = undefined
  export let restSvgProps = undefined
  export let tabIndex = undefined;
</script>

<AntdIcon {className} {spin} {rotate} {twoToneColor} {style} icon={<%= svgIdentifier %>Svg} {restProps} {restSvgProps} {tabIndex} />
`.trim()
  );

  await walk(async ({ svgIdentifier }) => {
    // generate icon file
    await writeFile(
      path.resolve(__dirname, `../src/icons/${svgIdentifier}.svelte`),
      render({ svgIdentifier })
    );
  });

  // generate icon index
  const entryText = Object.keys(allIconDefs)
    .sort()
    .map(
      (svgIdentifier) =>
        `export { default as ${svgIdentifier} } from './${svgIdentifier}.svelte';`
    )
    .join("\n");

  await promisify(fs.appendFile)(
    path.resolve(__dirname, "../src/icons/index.js"),
    `
// GENERATE BY ./scripts/generate.ts
// DON NOT EDIT IT MANUALLY

${entryText}
    `.trim()
  );
}

async function generateEntries() {
  const render = template(
    `
'use strict';
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  
  var _<%= svgIdentifier %> = _interopRequireDefault(require('./lib/icons/<%= svgIdentifier %>'));
  
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
  
  var _default = _<%= svgIdentifier %>;
  exports.default = _default;
  module.exports = _default;
`.trim()
  );

  await walk(async ({ svgIdentifier }) => {
    // generate `Icon.js` in root folder
    await writeFile(
      path.resolve(__dirname, `../${svgIdentifier}.js`),
      render({
        svgIdentifier
      })
    );

    // generate `Icon.d.ts` in root folder
    await writeFile(
      path.resolve(__dirname, `../${svgIdentifier}.d.ts`),
      `export { default } from './lib/icons/${svgIdentifier}';`
    );
  });
}

if (process.argv[2] === "--target=icon") {
  generateIcons();
}

if (process.argv[2] === "--target=entry") {
  generateEntries();
}
