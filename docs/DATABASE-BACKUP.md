# Database Backup and Recovery

This document describes the database backup system and recovery procedures for AIMMS Web.

## Backup System Overview

### External Volumes

The PostgreSQL and Redis data are stored in **external Docker volumes**, which provides protection against accidental deletion:

- `aimms_postgres_data_prod` - PostgreSQL database
- `aimms_redis_data_prod` - Redis cache

**Benefits:**
- ✅ Volumes persist even if containers are deleted
- ✅ `docker-compose down -v` will NOT delete these volumes
- ✅ Data survives complete stack recreation
- ❌ Can only be deleted with explicit `docker volume rm` command

### Automated Daily Backups

A cron job runs daily at 2:00 AM UTC to create compressed backups of the PostgreSQL database.

**Location:** `/home/ec2-user/postgres-backups/`

**Retention:** Last 7 days of backups are kept

**Script:** `/home/ec2-user/backup-postgres.sh`

**Log file:** `/home/ec2-user/postgres-backup.log`

## Backup Management

### Manual Backup

To create a backup immediately:

```bash
ssh aidset "/home/ec2-user/backup-postgres.sh"
```

### List Backups

```bash
ssh aidset "ls -lh /home/ec2-user/postgres-backups/"
```

### Download Backup

```bash
scp aidset:/home/ec2-user/postgres-backups/aimms_postgres_YYYYMMDD_HHMMSS.sql.gz ./
```

### View Backup Logs

```bash
ssh aidset "tail -50 /home/ec2-user/postgres-backup.log"
```

## Recovery Procedures

### Full Database Restore

1. **Download the backup file:**
```bash
scp aidset:/home/ec2-user/postgres-backups/aimms_postgres_YYYYMMDD_HHMMSS.sql.gz ./
```

2. **Uncompress the backup:**
```bash
gunzip aimms_postgres_YYYYMMDD_HHMMSS.sql.gz
```

3. **Copy to server and restore:**
```bash
# Copy backup to server
scp aimms_postgres_YYYYMMDD_HHMMSS.sql aidset:/tmp/

# Restore to database
ssh aidset "cat /tmp/aimms_postgres_YYYYMMDD_HHMMSS.sql | docker exec -i aimms-web-postgres-1 psql -U aimms_user"

# Clean up
ssh aidset "rm /tmp/aimms_postgres_YYYYMMDD_HHMMSS.sql"
```

### Restore Specific Database

If you only want to restore a specific database (not all databases):

```bash
# Extract specific database
ssh aidset "gunzip -c /home/ec2-user/postgres-backups/aimms_postgres_YYYYMMDD_HHMMSS.sql.gz | docker exec -i aimms-web-postgres-1 psql -U aimms_user -d aimms_web"
```

### Emergency: Recreate Database from Scratch

If the database is corrupted and you need to start fresh:

```bash
# 1. Stop services
ssh aidset "cd /home/ec2-user/aimms-web && docker-compose -f docker-compose.prod.yml down"

# 2. Delete the volume (DANGER: This deletes all data!)
ssh aidset "docker volume rm aimms_postgres_data_prod"

# 3. Recreate the volume
ssh aidset "docker volume create aimms_postgres_data_prod"

# 4. Start services (this initializes a fresh database)
ssh aidset "cd /home/ec2-user/aimms-web && docker-compose -f docker-compose.prod.yml up -d"

# 5. Wait for database to be ready
sleep 10

# 6. Restore from backup
gunzip -c aimms_postgres_YYYYMMDD_HHMMSS.sql.gz | ssh aidset "docker exec -i aimms-web-postgres-1 psql -U postgres"
```

## Volume Safety Features

### What PRESERVES Data:

✅ `docker-compose restart postgres`
✅ `docker-compose stop postgres && docker-compose start postgres`
✅ `docker-compose up -d postgres`
✅ `docker-compose down` (without `-v` flag)
✅ Rebuilding images: `docker-compose build && docker-compose up -d`
✅ Server reboots

### What DESTROYS Data:

❌ `docker volume rm aimms_postgres_data_prod` (explicit deletion)
❌ `docker volume prune` (if volume is not in use)
❌ Filesystem deletion of `/var/lib/docker/volumes/aimms_postgres_data_prod`

**Note:** `docker-compose down -v` will NOT delete external volumes!

## Monitoring

### Check Backup Status

```bash
# View most recent backup
ssh aidset "ls -lt /home/ec2-user/postgres-backups/ | head -5"

# Check backup log
ssh aidset "tail -20 /home/ec2-user/postgres-backup.log"

# Verify cron job is scheduled
ssh aidset "crontab -l"
```

### Test Backup Integrity

Periodically test that backups can be restored:

```bash
# Create a test restore
ssh aidset "gunzip -c /home/ec2-user/postgres-backups/aimms_postgres_LATEST.sql.gz | head -100"
```

## Backup Script Details

**Script location:** `/home/ec2-user/backup-postgres.sh`

**What it does:**
1. Creates a full dump of all PostgreSQL databases using `pg_dumpall`
2. Compresses the dump with gzip
3. Stores in `/home/ec2-user/postgres-backups/`
4. Removes backups older than 7 days
5. Logs all operations to `/home/ec2-user/postgres-backup.log`

**Cron schedule:**
```
0 2 * * * /home/ec2-user/backup-postgres.sh >> /home/ec2-user/postgres-backup.log 2>&1
```
Runs daily at 2:00 AM server time.

## Troubleshooting

### Backup Script Fails

Check the log file:
```bash
ssh aidset "cat /home/ec2-user/postgres-backup.log"
```

Common issues:
- Container name changed (update `CONTAINER_NAME` in script)
- Insufficient disk space
- PostgreSQL container not running

### Restore Fails

1. **Check PostgreSQL is running:**
```bash
ssh aidset "docker ps | grep postgres"
```

2. **Verify backup file integrity:**
```bash
ssh aidset "gunzip -t /home/ec2-user/postgres-backups/aimms_postgres_YYYYMMDD_HHMMSS.sql.gz"
```

3. **Check PostgreSQL logs:**
```bash
ssh aidset "docker logs aimms-web-postgres-1"
```

## Best Practices

1. **Test restores regularly** - At least quarterly, verify you can restore from backup
2. **Monitor disk space** - Ensure `/home/ec2-user/postgres-backups/` doesn't fill up
3. **Offsite backups** - Consider copying critical backups to S3 or another location
4. **Before major changes** - Always create a manual backup before migrations or updates
5. **Document changes** - If you modify the backup script, update this document

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Docker Volume Documentation](https://docs.docker.com/storage/volumes/)
- [pg_dump Reference](https://www.postgresql.org/docs/current/app-pgdump.html)
