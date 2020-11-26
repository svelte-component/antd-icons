<script>
  // import AccountBookTwoToneSvg from "@ant-design/icons-svg/lib/asn/AccountBookTwoTone";
  import { AccountBookOutlined } from "../src/index";
  // import AntIcon from "../src/components/AntdIcon.svelte";
  // import Test from "./test.svelte";
  function clickHandle() {
    console.log("click!");
  }
  let spin = false;

  function changeSpin() {
    spin = !spin;
    // console.log("spin: ", spin);
  }
  // const events = [
  //   {
  //     name: "click",
  //     handler() {
  //       alert(3);
  //     }
  //   }
  // ];
</script>

<AccountBookOutlined rotate={180} />
<!-- <div class="icon">westar</div>
<AntIcon
  on:click={clickHandle}
  {spin}
  twoToneColor={['red', 'blue']}
  icon={AccountBookTwoToneSvg} />
<button on:click={changeSpin}> change Primary </button> -->

<!-- <Test on:click={clickHandle} on="abc" /> -->
