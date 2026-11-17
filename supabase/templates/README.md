# Modèles d'e-mails (Supabase Auth)

Copies des modèles en ligne dans *Authentication → Emails → Templates* du projet `tlybokihwpshqsdtbnot`. Après une modification ici, recoller le fichier correspondant dans le tableau de bord.

| Fichier | Modèle Supabase | Objet |
|---|---|---|
| `invite.html` | Invite user | Votre accès au Portail Inter-Associatif |
| `recovery.html` | Reset password | Réinitialisation de votre mot de passe |
| `confirmation.html` | Confirm sign up | Confirmez votre adresse e-mail |
| `magic_link.html` | Magic link or OTP | Votre lien de connexion au Portail Inter-Associatif |
| `email_change.html` | Change email address | Confirmez votre nouvelle adresse e-mail |
| `reauthentication.html` | Reauthentication | Votre code de vérification |

## Envoi

SMTP personnalisé : Gmail (`smtp.gmail.com`, port 465) avec un mot de passe d'application Google, expéditeur « Portail Inter-Associatif ». Limite d'environ 500 e-mails par jour, suffisante pour le pilote. Avant l'ouverture au public : passer à une adresse sur un domaine dédié (Brevo + DKIM/SPF/DMARC).
