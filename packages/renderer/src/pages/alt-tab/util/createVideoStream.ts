export const createVideoStream = async (sourceId) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: sourceId,
        minWidth: 1280,
        maxWidth: 4000,
        minHeight: 720,
        maxHeight: 4000
      }
    }
  })

  return stream
}
