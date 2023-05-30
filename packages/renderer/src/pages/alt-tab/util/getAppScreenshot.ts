export const getAppScreenshot = (
  steam: any,
  imageFormat: string = 'image/jpeg',
  canvasWidth: number = 400,
  canvasHeight: number = 300
) => {
  const video = document.createElement('video')
  video.style.cssText = 'position: absolute;top:-10000px;left:-10000px'

  video.srcObject = steam
  document.body.appendChild(video)

  return new Promise<string>((resolve, reject) => {
    video.onloadedmetadata = function () {
      try {
        video.height = canvasHeight
        video.width = canvasWidth
        video.play()

        const canvas = document.createElement('canvas')
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

        resolve(canvas.toDataURL(imageFormat))

        video.remove()
        steam.getTrack()[0].stop()
      } catch (e) {
        reject(e)
      }
    }
  })
}
