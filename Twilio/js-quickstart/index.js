// getting Elements from Dom
const leaveButton = document.getElementById("leaveBtn");
const toggleMicButton = document.getElementById("toggleMicBtn");
const toggleWebCamButton = document.getElementById("toggleWebCamBtn");
const joinButton = document.getElementById("joinMeetingBtn");
const videoContainer = document.getElementById("videoContainer");
const textDiv = document.getElementById("textDiv");

// declare Variables
let meeting = null;
let meetingId = "";
let isMicOn = false;
let isWebCamOn = false;

// Create Meeting Button Event Listener
joinButton.addEventListener("click", async () => {
  document.getElementById("join-screen").style.display = "none";
  textDiv.textContent = "Please wait, we are joining the meeting";

  let idt = document.getElementById("meetingIdTxt").value;

  if (idt) {
    meetingId = idt;
  } else {
    const url = `https://api.videosdk.live/v2/rooms`;
    const options = {
      method: "POST",
      headers: { Authorization: TOKEN, "Content-Type": "application/json" },
    };

    const { roomId } = await fetch(url, options)
      .then((response) => response.json())
      .catch((error) => alert("error", error));
    meetingId = roomId;
  }

  initializeMeeting();
});

// Initialize meeting
function initializeMeeting() {
  // const video = Twilio.Video;

  window.VideoSDK.config(TOKEN);

  // var connectOptions = {
  //   name: "my-room",
  //   //logLevel: 'debug'
  // };

  meeting = window.VideoSDK.initMeeting({
    meetingId: meetingId, // required
    name: "The Migrator", // required
    micEnabled: true, // optional, default: true
    webcamEnabled: true, // optional, default: true
  });

  meeting.join();

  // video
  //   .connect(TOKEN, connectOptions)
  //   .then((room) => {
  //     console.log('Connected to Room "%s"', room.name);

  // room.participants.forEach(participantConnected);

  // room.on("participantConnected", participantConnected);

  // room.on("participantDisconnected", participantDisconnected);

  //  participant joined
  meeting.on("participant-joined", (participant) => {
    let videoElement = createVideoElement(
      participant.id,
      participant.displayName
    );
    let audioElement = createAudioElement(participant.id);

    participant.on("stream-enabled", (stream) => {
      setTrack(stream, audioElement, participant, false);
    });
    videoContainer.appendChild(videoElement);
    videoContainer.appendChild(audioElement);
  });

  // participants left
  meeting.on("participant-left", (participant) => {
    let vElement = document.getElementById(`f-${participant.id}`);
    vElement.remove(vElement);

    let aElement = document.getElementById(`a-${participant.id}`);
    aElement.remove(aElement);
  });

  // room.once("disconnected", (error) =>
  //   room.participants.forEach(participantDisconnected)
  // );

  meeting.on("meeting-joined", () => {
    textDiv.textContent = null;

    document.getElementById("grid-screen").style.display = "block";
    document.getElementById(
      "meetingIdHeading"
    ).textContent = `Meeting Id: ${meetingId}, you can open another tab and enter this meetingId`;
  });

  meeting.on("meeting-left", () => {
    videoContainer.innerHTML = "";
  });

  //   var localVideoTrack = video.createLocalVideoTrack();
  //   localVideoTrack.then((track) => {
  //     const localMediaContainer = document.getElementById("local-media");
  //     localMediaContainer.appendChild(track.attach());
  //   });

  //   var localTracksPromise = video.createLocalTracks({
  //     audio: true,
  //     video: { width: 640 },
  //   });
  //   localTracksPromise.then(function (tracks) {
  //     console.log(tracks);
  //     room.tracks = tracks;

  //     // var container = $("#participant-media")[0];
  //     var container = document.getElementById("participant-media");
  //     // console.log("Container", container);
  //     // var container = document.querySelector(".participant-media");
  //     var firstContainer = container[0];
  //     tracks.forEach(function (track) {
  //       firstContainer.appendChild(track.attach());
  //     });
  //   });
  // })
  // .catch(function (errorObj) {
  //   console.log(errorObj.message);
  //   $("#videoError").html(errorObj.message);
  // });

  // creating local participant
  createLocalParticipant();

  // setting local participant stream
  meeting.localParticipant.on("stream-enabled", (stream) => {
    setTrack(stream, null, meeting.localParticipant, true);
  });
}

// function participantConnected(participant) {
//   console.log('Participant "%s" connected', participant.identity);

//   const div = document.createElement("div");
//   div.id = participant.sid;
//   div.innerText = participant.identity;

//   participant.on("trackSubscribed", (track) => trackSubscribed(div, track));
//   participant.on("trackUnsubscribed", trackUnsubscribed);

//   participant.tracks.forEach((publication) => {
//     if (publication.isSubscribed) {
//       trackSubscribed(div, publication.track);
//     }
//   });

//   document.body.appendChild(div);
// }

// function participantDisconnected(participant) {
//   console.log('Participant "%s" disconnected', participant.identity);
//   document.getElementById(participant.sid).remove();
// }

// function trackSubscribed(div, track) {
//   console.log("trackSubscribed");
//   div.appendChild(track.attach());
// }

// function trackUnsubscribed(track) {
//   console.log("trackUnsubscribed");
//   track.detach().forEach((element) => element.remove());
// }

// creating video element
function createVideoElement(pId, name) {
  let videoFrame = document.createElement("div");
  videoFrame.setAttribute("id", `f-${pId}`);

  //create video
  let videoElement = document.createElement("video");
  videoElement.classList.add("video-frame");
  videoElement.setAttribute("id", `v-${pId}`);
  videoElement.setAttribute("playsinline", true);
  videoElement.setAttribute("width", "300");
  videoFrame.appendChild(videoElement);

  let displayName = document.createElement("div");
  displayName.innerHTML = `Name : ${name}`;

  videoFrame.appendChild(displayName);
  return videoFrame;
}

// creating audio element
function createAudioElement(pId) {
  let audioElement = document.createElement("audio");
  audioElement.setAttribute("autoPlay", "false");
  audioElement.setAttribute("playsInline", "true");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  audioElement.style.display = "none";
  return audioElement;
}

// creating local participant
function createLocalParticipant() {
  let localParticipant = createVideoElement(
    meeting.localParticipant.id,
    meeting.localParticipant.displayName
  );
  videoContainer.appendChild(localParticipant);
}

// setting media track
function setTrack(stream, audioElement, participant, isLocal) {
  if (stream.kind == "video") {
    isWebCamOn = true;
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    let videoElm = document.getElementById(`v-${participant.id}`);
    videoElm.srcObject = mediaStream;
    videoElm
      .play()
      .catch((error) =>
        console.error("videoElem.current.play() failed", error)
      );
  }
  if (stream.kind == "audio") {
    if (isLocal) {
      isMicOn = true;
    } else {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(stream.track);
      audioElement.srcObject = mediaStream;
      audioElement
        .play()
        .catch((error) => console.error("audioElem.play() failed", error));
    }
  }
}

// leave Meeting Button Event Listener
leaveButton.addEventListener("click", async () => {
  meeting?.leave();
  document.getElementById("grid-screen").style.display = "none";
  document.getElementById("join-screen").style.display = "block";
});

// Toggle Mic Button Event Listener
toggleMicButton.addEventListener("click", async () => {
  if (isMicOn) {
    // Disable Mic in Meeting
    meeting?.muteMic();
  } else {
    // Enable Mic in Meeting
    meeting?.unmuteMic();
  }
  isMicOn = !isMicOn;
});

// Toggle Web Cam Button Event Listener
toggleWebCamButton.addEventListener("click", async () => {
  if (isWebCamOn) {
    // Disable Webcam in Meeting
    meeting?.disableWebcam();

    let vElement = document.getElementById(`f-${meeting.localParticipant.id}`);
    vElement.style.display = "none";
  } else {
    // Enable Webcam in Meeting
    meeting?.enableWebcam();

    let vElement = document.getElementById(`f-${meeting.localParticipant.id}`);
    vElement.style.display = "inline";
  }
  isWebCamOn = !isWebCamOn;
});
