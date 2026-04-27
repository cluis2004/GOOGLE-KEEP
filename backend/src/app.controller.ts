import { Controller, Get} from '@nestjs/common';

@Controller('defaultcontroller')
export class AppController {
  constructor() {}

  @Get()
  getHello() {
    return 'Hello World!';
  }
}
