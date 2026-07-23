FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# ENV PLAYWRIGHT_BROWSERS_PATH=0
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN dnf install -y \
    atk \
    cups-libs \
    gtk3 \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXrandr \
    libXScrnSaver \
    libXtst \
    pango \
    alsa-lib \
    nss \
    nspr \
    xorg-x11-fonts-100dpi \
    xorg-x11-fonts-75dpi \
    xorg-x11-utils \
    xorg-x11-fonts-Type1 \
    xorg-x11-fonts-misc \
    && dnf clean all

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci

# Install Playwright Chromium browser binary
# RUN npx playwright install chromium
RUN npx playwright install chromium

# Copy compiled JavaScript output
COPY dist/ ./dist/

# Default CMD (overridden by functions in serverless.yml)
CMD [ "dist/handlers/schedulerHandler.handler" ]
