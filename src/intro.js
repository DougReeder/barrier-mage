// intro.js - introduction overlay for Barrier Mage
// Copyright © 2020 P. Douglas Reeder; Licensed under the GNU GPL-3.0

if (! sessionStorage.getItem('introDisabled')) {
  document.addEventListener("DOMContentLoaded", function (details) {
    let requirements = '';
    if (!window.hasNativeWebXRImplementation) {
      requirements = `<div>
This browser lacks <a href="https://caniuse.com/#search=webxr">native WebXR</a>, so don't complain about performance. </div>`;
    }

    if (! AFRAME.utils.device.checkHeadsetConnected() || (AFRAME.utils.device.isMobile() && ! AFRAME.utils.device.isMobileVR())) {
      requirements = `<div style="color:red">
This webapp requires a VR headset and a 6-DOF controller. Sorry.</div>`
    }

    const mt = atob("ZS1tYWlsOiA8YSBocmVmPSJtYWlsdG86dnJAaG9taW5pZHNvZnR3YXJlLmNvbT9zdWJqZWN0PUJhcnJpZXIlMjBNYWdlJmJvZHk9") +
        encodeURIComponent("\n\n\n" + navigator.userAgent + "\n\n\n") +
        atob("Ij52ckBob21pbmlkc29mdHdhcmUuY29tPC9hPg==");

    let html = `
<div class="wrapper">
    <div><b>Barrier Mage</b>: Draw mystic symbols to create barriers!</div>
    ${requirements}
    <img src="assets/symbols.png">
    <div>
      <video controls height="450">
          <source src="assets/Barrier Mage basic play 1.mp4" type="video/mp4">
          Sorry, your browser doesn't support embedded videos.
      </video>
    </div>
    <div style="font-family:serif; font-size: 0.75rem">
        <div>${mt}</div>
        <div><a href="CREDITS.md">Credits</a></div>
        <div>Uses <a href="https://caniuse.com/#search=webxr">WebXR</a>, and the <a href="https://aframe.io"><nobr>A-Frame</nobr></a> framework.</div>
        <div>Copyright © 2020 by P. Douglas Reeder; Licensed under the GNU GPL-3.0</div>
        <div><a href="https://github.com/DougReeder/barrier-mage">View source code and contribute</a> </div>
      </div>
</div>
`;

    let introEl = document.createElement('div');
    introEl.setAttribute('id', 'intro');
    introEl.setAttribute('style', `position:fixed; top:0; bottom:0; left:0; right:0;
                background: rgba(255,255,255,0.75);
                overflow-y: scroll`);

    introEl.innerHTML = html;

    document.body.appendChild(introEl);

  });
}
