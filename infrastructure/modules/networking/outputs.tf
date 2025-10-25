# ネットワーキングモジュール出力値

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR ブロック"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "インターネットゲートウェイ ID"
  value       = aws_internet_gateway.main.id
}

output "public_subnet_ids" {
  description = "パブリックサブネット ID リスト"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "プライベートサブネット ID リスト"
  value       = aws_subnet.private[*].id
}

output "public_subnet_cidrs" {
  description = "パブリックサブネット CIDR リスト"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_cidrs" {
  description = "プライベートサブネット CIDR リスト"
  value       = aws_subnet.private[*].cidr_block
}

output "nat_gateway_ids" {
  description = "NAT ゲートウェイ ID リスト"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "NAT ゲートウェイパブリック IP リスト"
  value       = aws_eip.nat[*].public_ip
}

output "public_route_table_id" {
  description = "パブリックルートテーブル ID"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "プライベートルートテーブル ID リスト"
  value       = aws_route_table.private[*].id
}