const IP_REGEX = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;

const getIp = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    let isResolved = false;
    
    const timeout = setTimeout(() => {
      if (!isResolved) {
        cleanup();
        reject(new Error('Timeout: Unable to detect IP address'));
      }
    }, 5000);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ]
    });

    const cleanup = () => {
      clearTimeout(timeout);
      pc.close();
      isResolved = true;
    };

    pc.createDataChannel('');

    pc.onicecandidate = (event) => {
      if (event.candidate && !isResolved) {
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(IP_REGEX);
        
        if (ipMatch && ipMatch[1] !== '0.0.0.0') {
          cleanup();
          resolve(ipMatch[1]);
        }
      }
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete' && !isResolved) {
        cleanup();
        reject(new Error('No valid IP address found'));
      }
    };

    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(error => {
        if (!isResolved) {
          cleanup();
          reject(error);
        }
      });
  });
};

export default getIp;