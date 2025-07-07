interface IpCandidate {
  ip: string;
  priority: number;
}

function getIpPriority(ip: string): number {
  if (ip.startsWith('127.')) return 1; // Loopback - lowest priority
  if (ip.startsWith('169.254.')) return 2; // Link-local - very low priority
  if (ip === '0.0.0.0') return 0; // Invalid - should not be used
  if (ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.')) return 3; // Private - low priority
  return 4; // Public - highest priority
}

function isValidIp(ip: string): boolean {
  return ip !== '0.0.0.0';
}

export default async function getIp(): Promise<string> {
  return new Promise((resolve, reject) => {
    const discoveredIps: IpCandidate[] = [];
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

    function cleanup() {
      clearTimeout(timeout);
      pc.close();
      isResolved = true;
    }

    function selectBestIp(): string | null {
      if (discoveredIps.length === 0) return null;
      
      // Filter out invalid IPs
      const validIps = discoveredIps.filter(candidate => isValidIp(candidate.ip));
      
      if (validIps.length === 0) return null;
      
      // Sort by priority (highest first)
      validIps.sort((a, b) => b.priority - a.priority);
      
      return validIps[0].ip;
    }

    pc.createDataChannel('');

    pc.onicecandidate = (event) => {
      if (event.candidate && !isResolved) {
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/);
        
        if (ipMatch) {
          const ip = ipMatch[1];
          const priority = getIpPriority(ip);
          
          // Add to discovered IPs if not already present
          if (!discoveredIps.some(candidate => candidate.ip === ip)) {
            discoveredIps.push({ ip, priority });
          }
          
          // If we found a high-priority (public) IP, resolve immediately
          if (priority === 4) {
            cleanup();
            resolve(ip);
          }
        }
      }
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete' && !isResolved) {
        const bestIp = selectBestIp();
        cleanup();
        
        if (bestIp) {
          resolve(bestIp);
        } else {
          reject(new Error('No valid IP address found'));
        }
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
}