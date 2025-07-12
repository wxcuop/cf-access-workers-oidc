# MIT License

Copyright (c) 2025 Cloudflare Access+Workers OIDC Provider

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Third-Party Licenses and Acknowledgments

This project makes use of several open-source libraries and services:

### Runtime Dependencies

- **Cloudflare Workers Runtime**: Cloudflare's edge computing platform
- **Durable Objects**: Cloudflare's distributed storage and compute primitives
- **Web Crypto API**: Standard cryptographic operations in web environments

### Development Dependencies

- **TypeScript**: MIT License - Copyright (c) Microsoft Corporation
- **Jest**: MIT License - Copyright (c) Meta Platforms, Inc.
- **Rollup**: MIT License - Copyright (c) 2017 [these people](https://github.com/rollup/rollup/graphs/contributors)
- **itty-router**: MIT License - Copyright (c) Kevin R. Whitley

### Cryptographic Libraries

- **rfc4648**: MIT License - Base64 encoding/decoding utilities
- **PBKDF2**: Implementation follows RFC 2898 standard

### Standards and Specifications

This project implements the following open standards:

- **OpenID Connect 1.0**: OpenID Foundation specification
- **OAuth 2.0**: IETF RFC 6749
- **JSON Web Tokens (JWT)**: IETF RFC 7519
- **JSON Web Keys (JWK)**: IETF RFC 7517
- **JSON Web Signature (JWS)**: IETF RFC 7515

### Acknowledgments

- Built on [Cloudflare Workers](https://workers.cloudflare.com/) and [Durable Objects](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- Implements [OpenID Connect](https://openid.net/connect/) standard
- Inspired by the need for self-hosted OIDC providers in edge computing environments
- Community contributions and feedback from the Cloudflare Workers ecosystem

---

## License Compatibility

This project is designed to be compatible with:

- **Commercial Use**: ✅ Allowed
- **Modification**: ✅ Allowed  
- **Distribution**: ✅ Allowed
- **Private Use**: ✅ Allowed
- **Patent Use**: ✅ Allowed (subject to MIT License terms)

### Obligations

When using this software, you must:

- **Include License**: Include the MIT License text in distributions
- **Include Copyright**: Include the copyright notice in distributions

### Limitations

This license provides:

- **No Liability**: Authors are not liable for damages
- **No Warranty**: Software is provided "as is" without warranty
- **No Trademark Rights**: License does not grant trademark rights

---

## Security and Compliance

### Security Considerations

This software handles authentication and authorization data. Users are responsible for:

- **Secure Deployment**: Following security best practices
- **Key Management**: Proper handling of cryptographic keys
- **Access Controls**: Implementing appropriate access controls
- **Monitoring**: Security monitoring and incident response

### Compliance

This software may be subject to various regulations depending on your use case:

- **GDPR**: European data protection regulation
- **CCPA**: California Consumer Privacy Act  
- **SOX**: Sarbanes-Oxley Act (for financial institutions)
- **HIPAA**: Health Insurance Portability and Accountability Act
- **Other Local Regulations**: Consult legal counsel for specific requirements

Users are responsible for ensuring compliance with applicable laws and regulations.

---

## Contributing

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

For more information, see the [CONTRIBUTING.md](../CONTRIBUTING.md) file in the project root.

---

## Contact

For questions about licensing or to report license-related issues:

- **Project Repository**: [https://github.com/wxcuop/CF-WORKERS-OIDC](https://github.com/wxcuop/CF-WORKERS-OIDC)
- **Issue Tracker**: [https://github.com/wxcuop/CF-WORKERS-OIDC/issues](https://github.com/wxcuop/CF-WORKERS-OIDC/issues)

---

*Last updated: July 12, 2025*
