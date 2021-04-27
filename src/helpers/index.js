const getCallId = () => window.location.pathname.split('/')[1];

const getPermissions = (params) => navigator.mediaDevices.getUserMedia(params);

export {
  getPermissions,
  getCallId
}