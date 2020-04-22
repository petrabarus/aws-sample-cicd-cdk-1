<?php

namespace MyAppTests;

use PHPUnit\Framework\TestCase;
use MyApp\MyClass;

class MyClassTest extends TestCase {

    public function testMethod1() {
        $object = new MyClass();
        $this->assertEquals(2, $object->method1(1, 1), 'Test Method 1 Case 1');
        $this->assertEquals(3, $object->method1(1, 2), 'Test Method 1 Case 2');
    }

    public function testMethod2() {
        $object = new MyClass();
        $this->assertEquals('11', $object->method2('1', '1'), 'Test Method 2 Case 1');
        $this->assertEquals('12', $object->method2('1', '2'), 'Test Method 2 Case 2');
    }
}
