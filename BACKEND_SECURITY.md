# 后端安全建议文档

本文档列出后端服务器 (tlbb.hfynxx.top) 无法通过前端代码直接修复的安全问题，需要在服务器端进行改进。

## 严重问题

### 1. 未启用 HTTPS
**问题**: 后端 API 使用 HTTP 明文传输，所有数据（包括账号密码）都以明文形式在网络中传输。

**风险**: 
- 中间人攻击可窃取用户凭证
- 会话令牌可被截获
- 充值操作可被篡改

**修复建议**:
- 申请免费 SSL 证书（Let's Encrypt）
- 在 Nginx/Apache 配置 HTTPS
- 强制 HTTP 重定向到 HTTPS
- 启用 HSTS (Strict-Transport-Security)

### 2. MD5 密码哈希
**问题**: 使用 MD5 存储密码，MD5 已被证明不安全，可被快速破解。

**风险**:
- 数据库泄露后密码可被快速破解
- 彩虹表攻击
- 暴力破解成本低

**修复建议**:
- 迁移到 bcrypt、scrypt 或 Argon2
- 为每个密码生成唯一盐值
- 增加工作因子（cost factor）
- 逐步迁移现有用户密码（下次登录时重新哈希）

### 3. JWT 存储在 localStorage
**问题**: JWT 令牌存储在 localStorage，容易受到 XSS 攻击。

**风险**:
- XSS 攻击可窃取令牌
- 攻击者可冒充用户执行任何操作

**修复建议**:
- 改用 httpOnly Cookie 存储 JWT
- 设置 Secure 标志（仅 HTTPS 传输）
- 设置 SameSite=Strict 防止 CSRF
- 实现令牌刷新机制

## 中等问题

### 4. 缺少验证码
**问题**: 注册和登录接口缺少验证码保护。

**风险**:
- 暴力破解攻击
- 批量注册垃圾账号
- 短信/邮件轰炸

**修复建议**:
- 登录失败 5 次后要求验证码
- 注册时添加图形验证码或滑块验证
- 考虑使用 reCAPTCHA 或 hCaptcha

### 5. 服务器信息泄露
**问题**: 响应头暴露 Nginx 版本号。

**风险**:
- 攻击者可针对特定版本的已知漏洞

**修复建议**:
```nginx
# Nginx 配置
server_tokens off;
```

### 6. 缺少安全响应头
**问题**: 缺少重要的安全 HTTP 响应头。

**修复建议**:
```nginx
# Nginx 配置
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### 7. 未认证的 API 端点
**问题**: 部分 API 端点可能缺少认证检查。

**风险**:
- 未授权访问敏感数据
- 数据泄露

**修复建议**:
- 审查所有 API 端点
- 确保敏感操作需要认证
- 实现基于角色的访问控制 (RBAC)

### 8. 缺少请求速率限制
**问题**: API 缺少速率限制。

**风险**:
- DDoS 攻击
- 暴力破解
- 资源耗尽

**修复建议**:
```nginx
# Nginx 配置
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend;
}
```

### 9. 缺少输入验证
**问题**: 可能缺少严格的输入验证。

**风险**:
- SQL 注入
- XSS 攻击
- 命令注入

**修复建议**:
- 使用参数化查询
- 验证所有用户输入
- 使用白名单验证
- 转义特殊字符

### 10. 缺少日志和监控
**问题**: 可能缺少详细的安全日志。

**修复建议**:
- 记录所有登录尝试
- 记录敏感操作
- 实现异常检测
- 设置告警机制

## 优先级排序

1. **立即修复** (P0):
   - 启用 HTTPS
   - 替换 MD5 密码哈希

2. **尽快修复** (P1):
   - JWT 迁移到 httpOnly Cookie
   - 添加验证码
   - 隐藏服务器版本

3. **计划修复** (P2):
   - 添加安全响应头
   - 实现速率限制
   - 审查 API 认证

4. **持续改进** (P3):
   - 输入验证加固
   - 日志和监控完善

## 实施建议

1. **分阶段实施**: 先修复 P0 问题，再逐步处理其他问题
2. **测试环境**: 在测试环境验证所有更改
3. **回滚计划**: 准备回滚方案以防问题
4. **用户通知**: 重大更改（如密码哈希迁移）需提前通知用户
5. **安全审计**: 定期进行安全审计和渗透测试

## 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Nginx 安全配置](https://www.nginx.com/blog/nginx-1-17-7-and-1-16-1-now-support-openssl-1-1-1/)
- [JWT 最佳实践](https://tools.ietf.org/html/rfc8725)
- [密码存储指南](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
