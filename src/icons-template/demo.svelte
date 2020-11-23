<script>
  import AntdIcon from "../components/AntdIcon.svelte";

  export let className = undefined;
  export let spin = undefined;
  export let rotate = undefined;
  export let twoToneColor = undefined;
  export let style;
</script>

<AntdIcon {className} {spin} {rotate} {twoToneColor} {style} />
