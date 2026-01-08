<?php

declare(strict_types=1);

namespace AetherVault;

use AetherVault\Exception\VaultException;

final class Vault
{
    private ?Client\TransportInterface $transport = null;
    private ?Identity\IdentityInterface $identity = null;
    private Context\Context $context;

    private function __construct()
    {
        $this->context = Context\Context::auto();
    }

    public static function connect(?string $endpoint = null): self
    {
        $vault = new self();
        
        if ($endpoint) {
            $vault->transport = new Client\HttpTransport($endpoint);
        }

        return $vault;
    }

    public function withIdentity(Identity\IdentityInterface $identity): self
    {
        $this->identity = $identity;
        return $this;
    }

    public function withContext(Context\Context $context): self
    {
        $this->context = $context;
        return $this;
    }

    public function database(): Capability\DatabaseAccess
    {
        $this->ensureConfigured();
        return new Capability\DatabaseAccess($this->transport, $this->identity, $this->context);
    }

    public function smtp(): Capability\SmtpAccess
    {
        $this->ensureConfigured();
        return new Capability\SmtpAccess($this->transport, $this->identity, $this->context);
    }

    public function tls(): Capability\TlsCertificate
    {
        $this->ensureConfigured();
        return new Capability\TlsCertificate($this->transport, $this->identity, $this->context);
    }

    private function ensureConfigured(): void
    {
        if (!$this->transport) {
            throw new VaultException('Transport endpoint must be configured');
        }
        if (!$this->identity) {
            throw new VaultException('Identity must be provided');
        }
    }
}