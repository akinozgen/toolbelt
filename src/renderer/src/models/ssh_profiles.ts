export interface ISSHProfile {
  id?: number;
  name: string;
  host: string;
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPass?: string;
}
