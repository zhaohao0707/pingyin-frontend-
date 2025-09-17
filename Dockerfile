# 多阶段构建 - 构建阶段
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置npm镜像源(可选，加速下载)
RUN npm config set registry https://registry.npmmirror.com

# 复制package文件
COPY package*.json ./

# 安装依赖 (使用ci命令确保一致性)
RUN npm ci --only=production --no-audit --no-fund

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段 - 使用nginx提供静态文件服务
FROM nginx:alpine

# 安装健康检查工具
RUN apk add --no-cache curl

# 创建非root用户
RUN addgroup -g 1001 -S nginx-group && \
    adduser -u 1001 -S nginx-user -G nginx-group

# 复制构建好的文件到nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 设置正确的权限
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    chown -R nginx-user:nginx-group /etc/nginx/conf.d

# 创建nginx运行时需要的目录
RUN touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# 切换到非root用户
USER nginx-user

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
