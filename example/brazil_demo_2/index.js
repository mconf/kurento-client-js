const MAX_FRAMERATE = 1;


function createOffer(peerConnection, onerror)
{
  peerConnection.createOffer(function(offer)
  {
    peerConnection.setLocalDescription(offer, function()
    {
      console.log('offer', offer.sdp);
    },
    onerror);
  },
  onerror);
};


window.addEventListener('load', function()
{
  var buttonStart     = document.getElementById("start");
  var buttonTerminate = document.getElementById("terminate");
  var calibrate       = document.getElementById("calibrate");

  var remoteVideo = document.getElementById("remoteVideo");


  var cpbWebRtc = new CpbWebRtc();


  function terminate()
  {
    remoteVideo.classList.remove("playing");

    // Enable connect button
    buttonStart.disabled = false;
  };

  function onerror(error)
  {
    console.error(error);

    terminate();
  };


  buttonStart.addEventListener('click', function()
  {
    var constraints =
    {
      audio: true,
      video:
      {
        mandatory:
        {
          maxFrameRate: MAX_FRAMERATE
        }
      }
    };

    getUserMedia(constraints, function(stream)
    {
      var videoInput  = document.getElementById("videoInput");
      videoInput.src = URL.createObjectURL(stream);

      // Disable start button
      buttonStart.disabled = true;

      // Show spinners
      remoteVideo.classList.add("playing");

      var peerConnection = new RTCPeerConnection(
      {
        iceServers: [{url: 'stun:stun.l.google.com:19302'}]
      });

      peerConnection.addStream(stream);

      createOffer(peerConnection, onerror);

      peerConnection.addEventListener('icecandidate', function(event)
      {
        var candidate = event.candidate;

        // We are still generating the candidates, don't send the SDP yet.
        if(candidate) return console.debug(candidate);

        var offer = this.localDescription;

        console.debug('offer+candidates', offer.sdp);

        cpbWebRtc.start(offer, function(error, answer)
        {
          if(error) return onerror(error);

          answer = new RTCSessionDescription({type: 'answer', 'sdp': answer});

          console.debug('answer', answer.sdp);

          peerConnection.setRemoteDescription(answer, function()
          {
//            var stream = peerConnection.getRemoteStreams()[0];
//
//            // Set the stream on the video tag
//            remoteVideo.src = URL.createObjectURL(stream);
//
//            // loopback
//            pipeline.connect(pointerDetectorAdv, webRtc, function(error)
//            {
//              if(error) return console.error(error);
//
//              console.log('loopback established');
//            });
          });
        });
      });

      peerConnection.onsignalingstatechange = function(event)
      {
        if(this.signalingState == "stable")
        {
          var stream = this.getRemoteStreams()[0];

          if(stream)
          {
            remoteVideo.src = URL.createObjectURL(stream);

            buttonTerminate.disabled = false;

            console.log('* Creation completed *');
          }
          else
            console.error("No remote streams are available");
        };
      };
    });
  });

  buttonTerminate.addEventListener('click', function()
  {
    // Disable terminate button
    buttonTerminate.disabled = true;

    // Terminate the connection
    cpbWebRtc.terminate();
    terminate();
  });

  calibrate.addEventListener('click', function()
  {
    cpbWebRtc.calibrate();
  });
});