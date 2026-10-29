import { Router, Request, Response } from 'express';
import os from 'node:os';
import { FirewallService } from '../../infrastructure/system/firewall.service';

export interface NetworkInterfaceDto {
  name: string;
  ip: string;
  port: number;
  fullUrl: string;
  isDefault: boolean;
}

export class InfoController {
  public readonly router: Router = Router();
  private readonly port: number = 4000;

  constructor(port: number = 4000) {
    this.port = port;
    this.router.get('/', this.getInfo.bind(this));
    this.router.post('/firewall', this.configureFirewall.bind(this));
  }

  private async configureFirewall(_req: Request, res: Response): Promise<void> {
    const result = await FirewallService.allowPort(this.port);
    res.status(result.success ? 200 : 500).json(result);
  }

  private getInfo(_req: Request, res: Response): void {
    const interfaces = this.detectNetworkInterfaces();
    const primary = interfaces.find((i) => i.isDefault) || interfaces[0] || {
      name: 'Localhost',
      ip: 'localhost',
      port: this.port,
      fullUrl: `http://localhost:${this.port}`,
      isDefault: true,
    };

    const payload = {
      ip: `${primary.ip}:${primary.port}`,
      rawIp: primary.ip,
      port: primary.port,
      interfaces,
    };

    res.status(200).json({
      ...payload,
      data: payload,
    });
  }

  public detectNetworkInterfaces(): NetworkInterfaceDto[] {
    const ifaces = os.networkInterfaces();
    const candidates: Array<{ name: string; ip: string; score: number }> = [];

    // Regex to detect virtual/tunnel/VPN/container network interfaces
    const virtualNameRegex = /radmin|hamachi|tailscale|zerotier|wireguard|vpn|virtual|vbox|vmware|hyper-v|vethernet|switch|wsl|docker|container|bridge|loopback|pseudo|teredo|bluetooth|tap|tun|p2p|awdl/i;

    for (const [name, netList] of Object.entries(ifaces)) {
      if (!netList) continue;
      for (const net of netList) {
        // Skip non-IPv4 or internal loopback interfaces
        const isIpv4 = net.family === 'IPv4' || (net as any).family === 4;
        if (!isIpv4 || net.internal) continue;

        const ip = net.address;
        if (!ip || ip.startsWith('127.') || ip.startsWith('169.254.')) continue;

        let score = 0;
        const lowerName = name.toLowerCase();
        const isVirtualName = virtualNameRegex.test(lowerName);

        // Subnet analysis
        if (ip.startsWith('192.168.')) {
          if (ip.startsWith('192.168.56.')) {
            // VirtualBox host-only default network
            score -= 100;
          } else {
            // Standard home/office Wi-Fi and Ethernet router subnet
            score += 100;
          }
        } else if (ip.startsWith('10.')) {
          // Standard private Class A network
          score += 80;
        } else if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) {
          // Private Class B network (often Docker or WSL/Hyper-V, but could be real LAN)
          score += isVirtualName ? 10 : 50;
        } else if (ip.startsWith('26.')) {
          // Radmin VPN default network
          score -= 160;
        } else if (ip.startsWith('25.')) {
          // Hamachi VPN network
          score -= 160;
        }

        // Interface name analysis
        if (/wi-?fi|wlan|wireless/i.test(lowerName)) {
          score += 60;
        } else if (/ethernet|eth|en\d/i.test(lowerName)) {
          if (!isVirtualName) {
            score += 45;
          }
        }

        if (isVirtualName) {
          score -= 130;
        }

        if (net.netmask === '255.255.255.0') {
          score += 10;
        }

        candidates.push({ name, ip, score });
      }
    }

    if (candidates.length === 0) {
      return [
        {
          name: 'Localhost',
          ip: 'localhost',
          port: this.port,
          fullUrl: `http://localhost:${this.port}`,
          isDefault: true,
        },
      ];
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);

    return candidates.map((c, idx) => ({
      name: c.name,
      ip: c.ip,
      port: this.port,
      fullUrl: `http://${c.ip}:${this.port}`,
      isDefault: idx === 0,
    }));
  }
}
