-- Extensions nécessaires avant les migrations du portail :
-- pg_cron planifie la purge RGPD et l'envoi des SMS ; pg_net appelle la fonction Edge.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
