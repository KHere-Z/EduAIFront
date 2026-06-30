-- ============================================
-- EduAI · 安文AI教育 · 数据库初始化脚本
-- MySQL 8.0 · 字符集 utf8mb4
-- ============================================

CREATE DATABASE IF NOT EXISTS eduai
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eduai;

-- 1. 机构表
CREATE TABLE IF NOT EXISTS organization (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT '机构名称',
  type TINYINT DEFAULT 2 COMMENT '1=学校 2=培训机构',
  address VARCHAR(500),
  contact VARCHAR(100),
  status TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='机构';

-- 2. 用户表
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  password VARCHAR(200) NOT NULL COMMENT 'BCrypt加密',
  real_name VARCHAR(50) COMMENT '真实姓名',
  phone VARCHAR(20),
  email VARCHAR(100),
  role_type TINYINT NOT NULL DEFAULT 3 COMMENT '1=admin 3=teacher 4=student',
  status TINYINT DEFAULT 1 COMMENT '1=正常 0=禁用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 3. 老师表
CREATE TABLE IF NOT EXISTS teachers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE COMMENT '关联用户',
  subject_ids VARCHAR(500) NOT NULL DEFAULT 'math' COMMENT '任教学科，逗号分隔',
  org_id BIGINT COMMENT '所属机构',
  title VARCHAR(100) COMMENT '职称',
  bio TEXT COMMENT '简介',
  avatar VARCHAR(255) COMMENT '头像URL',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (org_id) REFERENCES organization(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='老师信息';

-- ==== 测试数据 ====

INSERT INTO organization (id, name, type) VALUES (1, '第一实验中学', 1);

-- 密码: coach123 / english123 / admin123 (BCrypt 加密)
INSERT INTO users (id, username, password, real_name, role_type, status) VALUES
  (1, 'coach',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '李老师', 3, 1),
  (2, 'english', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '王老师', 3, 1),
  (3, 'admin',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '管理员', 1, 1);

INSERT INTO teachers (user_id, subject_ids, org_id, title) VALUES
  (1, 'math,physics', 1, '高级教师'),
  (2, 'english', 1, '一级教师');

-- ==== 验证 ====
SELECT u.id, u.username, u.real_name, u.role_type, t.subject_ids
FROM users u LEFT JOIN teachers t ON u.id = t.user_id;
