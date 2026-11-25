import {
  Box,
  Database,
  HardDrive,
  KeyRound,
  Network,
  Server,
  Shield,
  ShieldHalf,
  UserRound,
  UserRoundCog,
} from 'lucide-react'

type ResourceTypeMeta = {
  label: string
  plural: string
  icon: React.ElementType
}

/** Display names for provider-native resource types. */
export const RESOURCE_TYPES: Record<string, ResourceTypeMeta> = {
  'AWS::EC2::Instance': {
    label: 'EC2 instance',
    plural: 'EC2 instances',
    icon: Server,
  },
  'AWS::S3::Bucket': { label: 'S3 bucket', plural: 'S3 buckets', icon: Box },
  'AWS::RDS::DBInstance': {
    label: 'RDS database',
    plural: 'RDS databases',
    icon: Database,
  },
  'AWS::IAM::User': { label: 'IAM user', plural: 'IAM users', icon: UserRound },
  'AWS::IAM::Role': {
    label: 'IAM role',
    plural: 'IAM roles',
    icon: UserRoundCog,
  },
  'AWS::IAM::AccountPasswordPolicy': {
    label: 'Password policy',
    plural: 'Password policies',
    icon: KeyRound,
  },
  'AWS::EC2::SecurityGroup': {
    label: 'Security group',
    plural: 'Security groups',
    icon: Shield,
  },
  'AWS::EC2::VPC': { label: 'VPC', plural: 'VPCs', icon: Network },
  'AWS::EC2::Volume': {
    label: 'EBS volume',
    plural: 'EBS volumes',
    icon: HardDrive,
  },
}

export const resourceTypeMeta = (type: string): ResourceTypeMeta =>
  RESOURCE_TYPES[type] ?? {
    label: type.split('::').slice(1).join(' '),
    plural: type,
    icon: ShieldHalf,
  }

/** Groups shown as summary tiles above the inventory table. */
export const INVENTORY_GROUPS = [
  {
    id: 'ec2',
    label: 'EC2 instances',
    icon: Server,
    types: ['AWS::EC2::Instance'],
  },
  { id: 's3', label: 'S3 buckets', icon: Box, types: ['AWS::S3::Bucket'] },
  {
    id: 'rds',
    label: 'RDS databases',
    icon: Database,
    types: ['AWS::RDS::DBInstance'],
  },
  {
    id: 'iam',
    label: 'IAM',
    icon: UserRoundCog,
    types: [
      'AWS::IAM::User',
      'AWS::IAM::Role',
      'AWS::IAM::AccountPasswordPolicy',
    ],
  },
  {
    id: 'sg',
    label: 'Security groups',
    icon: Shield,
    types: ['AWS::EC2::SecurityGroup'],
  },
] as const
