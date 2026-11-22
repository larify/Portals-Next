import { remoteBoolean } from '../../shared/remote';
import { policyPathRemote } from '../shared';

export const appendRemote = policyPathRemote({ 'no-alert': remoteBoolean });
