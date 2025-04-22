// Common security group rules
export const initialCommonRules = [
  {
    name: "HTTP (80)",
    protocol: "tcp",
    fromPort: 80,
    toPort: 80,
    cidrBlock: "0.0.0.0/0",
    description: "HTTP Traffic"
  },
  {
    name: "HTTPS (443)",
    protocol: "tcp",
    fromPort: 443,
    toPort: 443,
    cidrBlock: "0.0.0.0/0",
    description: "HTTPS Traffic"
  },
  {
    name: "SSH (22)",
    protocol: "tcp",
    fromPort: 22,
    toPort: 22,
    cidrBlock: "0.0.0.0/0",
    description: "SSH Access"
  },
  {
    name: "MySQL/Aurora (3306)",
    protocol: "tcp",
    fromPort: 3306,
    toPort: 3306,
    cidrBlock: "0.0.0.0/0",
    description: "MySQL Database Access"
  },
  {
    name: "PostgreSQL (5432)",
    protocol: "tcp",
    fromPort: 5432,
    toPort: 5432,
    cidrBlock: "0.0.0.0/0",
    description: "PostgreSQL Database Access"
  },
  {
    name: "RDP (3389)",
    protocol: "tcp",
    fromPort: 3389,
    toPort: 3389,
    cidrBlock: "0.0.0.0/0",
    description: "Remote Desktop Access"
  }
]; 