<template>
  <div>
    <div className="videos">
      <audio :srcObject="streams.local" autoPlay muted></audio>
      <audio :srcObject="streams.remote" autoPlay></audio>
    </div>
  </div>
</template>

<script setup>
import {getFirestore} from './firebase';
import {ref, reactive, onMounted} from 'vue';
import {getPermissions, getCallId} from './helpers';
import servers from './data/google-servers.json';

const peerConnection = new RTCPeerConnection(servers);
const firestore = getFirestore();
const callId = getCallId();
let loading = ref(true);
let streams = reactive({
  remote: new MediaStream(),
  local: new MediaStream()
});

onMounted(() => {
  getPermissions({
    audio: true
  })
    .then(setLocalStream)
    .then(setRemoteStreamEvent)
    .then(() => {
      loading = false
      initCall();
    });
})

function setLocalStream(stream) {
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
  streams.local = stream;
}

function setRemoteStreamEvent() {
  peerConnection.addEventListener('track', (e) => {
    e.streams[0].getTracks().forEach((track) => {
      streams.remote.addTrack(track);
    });
  })
}

function initCall() {
  callId ? connectToCall() : createNewCall();
}

function getCollectionData(id) {
  const doc = firestore.collection('calls').doc(id);

  return {
    doc,
    answers: doc.collection('answers'),
    offers: doc.collection('offers'),
  }
}

function connectToCall() {
  const { doc, answers, offers } = getCollectionData(callId)

  peerConnection.addEventListener('icecandidate', (e) => {
    e.candidate && answers.add(e.candidate.toJSON());
  })

  doc.get()
    .then(session => session.data())
    .then(data => peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer)))
    .then(() => peerConnection.createAnswer())
    .then((answer) => {
      const { sdp, type } = answer
      return Promise.all[
        peerConnection.setLocalDescription(answer),
        doc.update({ answer: { sdp, type } })
      ]
    })
    .then(() => offers.onSnapshot(addCandidateToConnection))
    .catch(e => {
      console.log(e);
    })
}

function createNewCall() {
  const { doc, answers, offers } = getCollectionData();

  peerConnection.addEventListener('icecandidate', (e) => {
    e.candidate && offers.add(e.candidate.toJSON());
  })

  peerConnection.createOffer()
    .then((session) => {
        peerConnection.setLocalDescription(session)
          .then(() => {
            const { sdp, type } = session;
            doc.set({offer: { sdp, type }})
          })
          .then(() => {
            doc.onSnapshot(remoteAnswerListener);
            answers.onSnapshot(addCandidateToConnection);
            history.pushState({}, document.title, `${window.location.origin}/${doc.id}`)
          })
          .catch(e => {
            console.log(e);
          })
      }
    )
}

function remoteAnswerListener(e) {
  const data = e.data();
  if (!peerConnection.currentRemoteDescription && data?.answer) {
    const answerDescription = new RTCSessionDescription(data.answer);
    peerConnection.setRemoteDescription(answerDescription);
  }
}

function addCandidateToConnection(e) {
  e.docChanges().forEach((change) => {
    if (change.type === 'added') {
      peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
    }
  });
}
</script>
