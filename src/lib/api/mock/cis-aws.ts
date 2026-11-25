/**
 * CIS Amazon Web Services Foundations Benchmark v3.0.0 controls, with
 * short plain-language descriptions. Findings link to a control through
 * their complianceRefs ("CIS AWS 2.1.4").
 */
import { type ComplianceControl, type ComplianceSection } from '@/types/cspm'

type ControlDef = Pick<
  ComplianceControl,
  'controlId' | 'title' | 'description' | 'level' | 'assessment'
>

export const CIS_AWS_FRAMEWORK = {
  id: 'cis-aws',
  name: 'CIS AWS Foundations Benchmark',
  version: '3.0.0',
}

export const CIS_AWS_SECTIONS: ComplianceSection[] = [
  { id: '1', title: 'Identity and Access Management' },
  { id: '2', title: 'Storage' },
  { id: '3', title: 'Logging' },
  { id: '4', title: 'Monitoring' },
  { id: '5', title: 'Networking' },
]

const auto = (
  controlId: string,
  title: string,
  description: string,
  level: 1 | 2 = 1
): ControlDef => ({
  controlId,
  title,
  description,
  level,
  assessment: 'automated',
})

const manual = (
  controlId: string,
  title: string,
  description: string,
  level: 1 | 2 = 1
): ControlDef => ({
  controlId,
  title,
  description,
  level,
  assessment: 'manual',
})

export const CIS_AWS_CONTROLS: ControlDef[] = [
  // 1. Identity and Access Management
  manual(
    '1.1',
    'Maintain current contact details',
    'Account contact details are correct so AWS can reach you about security issues.'
  ),
  manual(
    '1.2',
    'Ensure security contact information is registered',
    'A security contact is set so AWS security notices reach the right team.'
  ),
  manual(
    '1.3',
    'Ensure security questions are registered in the AWS account',
    'Security questions help recover the root account.'
  ),
  auto(
    '1.4',
    'Ensure no root user account access key exists',
    'The root user has no programmatic access keys.'
  ),
  auto(
    '1.5',
    'Ensure MFA is enabled for the "root user" account',
    'Root sign-in requires a second factor.'
  ),
  auto(
    '1.6',
    'Ensure hardware MFA is enabled for the "root user" account',
    'Root MFA uses a hardware device rather than an app.',
    2
  ),
  manual(
    '1.7',
    'Eliminate use of the "root" user for administrative and daily tasks',
    'People use IAM identities, not root, for everyday work.'
  ),
  auto(
    '1.8',
    'Ensure IAM password policy requires minimum length of 14 or greater',
    'Console passwords are at least 14 characters.'
  ),
  auto(
    '1.9',
    'Ensure IAM password policy prevents password reuse',
    'Users cannot reuse recent passwords.'
  ),
  auto(
    '1.10',
    'Ensure MFA is enabled for all IAM users that have a console password',
    'Every console user signs in with a second factor.'
  ),
  manual(
    '1.11',
    'Do not setup access keys during initial user setup for all IAM users that have a console password',
    'Access keys are only created when a user needs them.'
  ),
  auto(
    '1.12',
    'Ensure credentials unused for 45 days or more are disabled',
    'Stale passwords and keys are switched off.'
  ),
  auto(
    '1.13',
    'Ensure there is only one active access key available for any single IAM user',
    'Each user has at most one active key.'
  ),
  auto(
    '1.14',
    'Ensure access keys are rotated every 90 days or less',
    'Long-lived keys are replaced regularly.'
  ),
  auto(
    '1.15',
    'Ensure IAM Users Receive Permissions Only Through Groups',
    'Permissions are managed through groups, not per user.'
  ),
  auto(
    '1.16',
    'Ensure IAM policies that allow full "*:*" administrative privileges are not attached',
    'No identity has unrestricted admin access.'
  ),
  auto(
    '1.17',
    'Ensure a support role has been created to manage incidents with AWS Support',
    'A role exists for working with AWS Support during incidents.'
  ),
  manual(
    '1.18',
    'Ensure IAM instance roles are used for AWS resource access from instances',
    'Instances use roles, not stored keys.',
    2
  ),
  auto(
    '1.19',
    'Ensure that all the expired SSL/TLS certificates stored in AWS IAM are removed',
    'No expired certificates remain in IAM.'
  ),
  auto(
    '1.20',
    'Ensure that IAM Access analyzer is enabled for all regions',
    'Access Analyzer flags resources shared outside the account.'
  ),
  manual(
    '1.21',
    'Ensure IAM users are managed centrally via identity federation or AWS Organizations',
    'People sign in through a central identity provider.',
    2
  ),
  manual(
    '1.22',
    'Ensure access to AWSCloudShellFullAccess is restricted',
    'Few identities can use CloudShell with full access.'
  ),

  // 2. Storage
  auto(
    '2.1.1',
    'Ensure S3 Bucket Policy is set to deny HTTP requests',
    'Buckets only accept encrypted (HTTPS) requests.',
    2
  ),
  manual(
    '2.1.2',
    'Ensure MFA Delete is enabled on S3 buckets',
    'Deleting object versions requires MFA.',
    2
  ),
  manual(
    '2.1.3',
    'Ensure all data in Amazon S3 has been discovered, classified and secured when required',
    'You know which buckets hold sensitive data.',
    2
  ),
  auto(
    '2.1.4',
    'Ensure that S3 Buckets are configured with "Block public access"',
    'Block Public Access is on for buckets and the account.'
  ),
  auto(
    '2.2.1',
    'Ensure EBS Volume Encryption is Enabled in all Regions',
    'New EBS volumes are encrypted by default.'
  ),
  auto(
    '2.3.1',
    'Ensure that encryption-at-rest is enabled for RDS Instances',
    'Database storage and snapshots are encrypted.'
  ),
  auto(
    '2.3.2',
    'Ensure Auto Minor Version Upgrade feature is Enabled for RDS Instances',
    'Databases receive minor security patches automatically.'
  ),
  auto(
    '2.3.3',
    'Ensure that public access is not given to RDS Instance',
    'Databases are not reachable from the internet.'
  ),
  auto(
    '2.4.1',
    'Ensure that encryption is enabled for EFS file systems',
    'Shared file systems are encrypted at rest.'
  ),

  // 3. Logging
  auto(
    '3.1',
    'Ensure CloudTrail is enabled in all regions',
    'API activity is recorded in every region.'
  ),
  auto(
    '3.2',
    'Ensure CloudTrail log file validation is enabled',
    'Tampering with trail logs can be detected.',
    2
  ),
  auto(
    '3.3',
    'Ensure AWS Config is enabled in all regions',
    'Configuration changes are recorded everywhere.',
    2
  ),
  auto(
    '3.4',
    'Ensure S3 bucket access logging is enabled on the CloudTrail S3 bucket',
    'Access to the audit log bucket is itself logged.'
  ),
  auto(
    '3.5',
    'Ensure CloudTrail logs are encrypted at rest using KMS CMKs',
    'Trail logs use a customer-managed key.',
    2
  ),
  auto(
    '3.6',
    'Ensure rotation for customer-created symmetric CMKs is enabled',
    'Encryption keys rotate automatically.',
    2
  ),
  auto(
    '3.7',
    'Ensure VPC flow logging is enabled in all VPCs',
    'Network traffic records exist for investigations.',
    2
  ),
  auto(
    '3.8',
    'Ensure that Object-level logging for write events is enabled for S3 bucket',
    'Writes to S3 objects are recorded.',
    2
  ),
  auto(
    '3.9',
    'Ensure that Object-level logging for read events is enabled for S3 bucket',
    'Reads of S3 objects are recorded.',
    2
  ),

  // 4. Monitoring
  auto(
    '4.1',
    'Ensure unauthorized API calls are monitored',
    'An alarm fires on repeated access-denied API calls.',
    2
  ),
  auto(
    '4.2',
    'Ensure management console sign-in without MFA is monitored',
    'An alarm fires when someone signs in without MFA.'
  ),
  auto(
    '4.3',
    'Ensure usage of the "root" account is monitored',
    'An alarm fires whenever root is used.'
  ),
  auto(
    '4.4',
    'Ensure IAM policy changes are monitored',
    'An alarm fires on IAM policy changes.'
  ),
  auto(
    '4.5',
    'Ensure CloudTrail configuration changes are monitored',
    'An alarm fires if logging is changed or stopped.'
  ),
  auto(
    '4.6',
    'Ensure management console authentication failures are monitored',
    'An alarm fires on repeated failed sign-ins.',
    2
  ),
  auto(
    '4.7',
    'Ensure disabling or scheduled deletion of customer created CMKs is monitored',
    'An alarm fires when a key is disabled or scheduled for deletion.',
    2
  ),
  auto(
    '4.8',
    'Ensure S3 bucket policy changes are monitored',
    'An alarm fires when a bucket policy changes.'
  ),
  auto(
    '4.9',
    'Ensure AWS Config configuration changes are monitored',
    'An alarm fires if AWS Config is changed.',
    2
  ),
  auto(
    '4.10',
    'Ensure security group changes are monitored',
    'An alarm fires when firewall rules change.',
    2
  ),
  auto(
    '4.11',
    'Ensure Network Access Control Lists (NACL) changes are monitored',
    'An alarm fires when network ACLs change.',
    2
  ),
  auto(
    '4.12',
    'Ensure changes to network gateways are monitored',
    'An alarm fires when internet or NAT gateways change.'
  ),
  auto(
    '4.13',
    'Ensure route table changes are monitored',
    'An alarm fires when routing changes.'
  ),
  auto(
    '4.14',
    'Ensure VPC changes are monitored',
    'An alarm fires when VPCs change.'
  ),
  auto(
    '4.15',
    'Ensure AWS Organizations changes are monitored',
    'An alarm fires when the organisation structure changes.'
  ),
  auto(
    '4.16',
    'Ensure AWS Security Hub is enabled',
    'Security Hub aggregates security findings.',
    2
  ),

  // 5. Networking
  auto(
    '5.1',
    'Ensure no Network ACLs allow ingress from 0.0.0.0/0 to remote server administration ports',
    'Network ACLs block SSH and RDP from the internet.'
  ),
  auto(
    '5.2',
    'Ensure no security groups allow ingress from 0.0.0.0/0 to remote server administration ports',
    'Security groups block SSH and RDP from the internet.'
  ),
  auto(
    '5.3',
    'Ensure no security groups allow ingress from ::/0 to remote server administration ports',
    'Security groups block SSH and RDP from the IPv6 internet.'
  ),
  auto(
    '5.4',
    'Ensure the default security group of every VPC restricts all traffic',
    'Default security groups allow nothing.',
    2
  ),
  manual(
    '5.5',
    'Ensure routing tables for VPC peering are "least access"',
    'Peered VPCs only route what they need.',
    2
  ),
  auto(
    '5.6',
    'Ensure that EC2 Metadata Service only allows IMDSv2',
    'Instances require session tokens for metadata.',
    2
  ),
]
