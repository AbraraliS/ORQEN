#!/bin/bash
set -e

echo "========================================="
echo " Installing Docker for Fedora 44         "
echo "========================================="
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager addrepo --from-repofile=https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
if ! getent group docker > /dev/null; then
    sudo groupadd docker
fi
sudo usermod -aG docker $USER

echo "========================================="
echo " Installing Nhost CLI                    "
echo "========================================="
curl -L https://raw.githubusercontent.com/nhost/cli/main/get.sh | sudo bash

echo "========================================="
echo " Setup Complete!                         "
echo "========================================="
echo "IMPORTANT: To apply the docker group changes, you must either:"
echo "1. Run 'newgrp docker' in your terminal, OR"
echo "2. Log out and log back in."
echo ""
echo "After you've done that, please let me know so I can run 'nhost dev'."
