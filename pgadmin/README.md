# pgAdmin - Database Administration Tool

This directory contains the pgAdmin configuration for viewing and managing the AIMMS Web PostgreSQL database.

## Quick Access for Students

When you run `npm run dev:build`, pgAdmin is automatically available at:
- **URL**: http://localhost:5050
- **Login**: `admin@example.com` / `admin`
- **Database Password**: `dev` (when connecting to the database)

## How to Connect

1. Go to http://localhost:5050
2. Login with `admin@example.com` / `admin`
3. Click on "AIMMS Local Database" in the left panel
4. When prompted, enter password: `dev`
5. Browse database tables and run SQL queries!

## What You Can Do

- **Browse Tables**: View all database tables and their data
- **Run SQL Queries**: Execute custom SQL commands using the Query Tool
- **View Relationships**: See how tables connect to each other
- **Monitor Activity**: Check database connections and running queries
- **Export Data**: Download table data as CSV or other formats

## Useful for Learning

pgAdmin is great for:
- Understanding the database structure
- Debugging data issues
- Learning SQL by exploring real data
- Seeing how the application stores information

## Production Notes

pgAdmin is only for development. In production:
- Use cloud provider database consoles (AWS RDS, Google Cloud SQL, etc.)
- Or connect directly via `psql` command line tool
- Never deploy pgAdmin with default passwords